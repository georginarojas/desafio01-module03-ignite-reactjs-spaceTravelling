import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { RichText } from 'prismic-dom';
import Header from '../../components/Header';
import { useRouter } from 'next/router';

import { getPrismicClient } from '../../services/prismic';
import Prismic from '@prismicio/client';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { FiUser, FiCalendar, FiClock } from 'react-icons/fi';
import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  uid: string;
  data: {
    title: string;
    subject: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  // Reading time - start
  const numberWords = post.data.content.reduce((acc, content) => {
    const headingWords = content.heading.split(' ').length;
    const bodyWords = RichText.asText(content.body).split(' ').length;
    acc += headingWords + bodyWords;
    return acc;
  }, 0);

  const readingTime = Math.ceil(numberWords / 200);
  // Reading time - End

  return (
    <>
      <Head>
        <title>Post | SpaceTravelling</title>
      </Head>
      <Header />
      <div className={styles.Banner}>
        <img src={post.data.banner.url} alt="post image" />
      </div>

      <main className={commonStyles.Container}>
        <article className={styles.Post}>
          <h1>{post.data.title}</h1>
          <div className={styles.Informations}>
            <div>
              <FiCalendar size={20} />
              <time>
                {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                  locale: ptBR,
                })}
              </time>
            </div>
            <div>
              <FiUser size={20} />
              <span>{post.data.author}</span>
            </div>
            <div>
              <FiClock size={20} />
              <span>{readingTime} min</span>
            </div>
          </div>
          {post.data.content.map((content, index) => (
            <div key={index} className={styles.PostContent}>
              <h2>{content.heading}</h2>
              <div
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(content.body),
                }}
              />
            </div>
          ))}
        </article>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    Prismic.predicates.at('document.type', 'post'),
    {
      fetch: ['post.title'],
      pageSize: 1,
    }
  );

  const postsSlug = posts.results.map(post => {
    return {
      params: { slug: post.uid },
    };
  });

  return {
    paths: postsSlug,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('post', String(slug), {});

  const post = {
    first_publication_date: response.first_publication_date,
    uid: response.uid,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content,
    },
  };

  // console.log('RESPONSE POST ', JSON.stringify(post, null, 2));

  return {
    props: {
      post,
    },
    revalidate: 60 * 60 * 24, // 24 hours
  };
};
