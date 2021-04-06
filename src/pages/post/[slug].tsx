import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';

import { RichText } from 'prismic-dom';
import { useRouter } from 'next/router';

import Header from '../../components/Header';
import Comments from '../../components/Comments';

import { getPrismicClient } from '../../services/prismic';
import Prismic from '@prismicio/client';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { FiUser, FiCalendar, FiClock } from 'react-icons/fi';
import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  last_publication_date: string | null;
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

interface xPost {
  title: string;
  uid: string;
}

interface PostProps {
  post: Post;
  preview: boolean;
  prevPost: xPost;
  nextPost: xPost;
}

export default function Post({
  post,
  preview,
  prevPost,
  nextPost,
}: PostProps): JSX.Element {
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
            <div className={styles.DateEdit}>
              <p>
                editado em
                <time>
                  {format(
                    new Date(post.first_publication_date),
                    'dd MMM yyyy',
                    {
                      locale: ptBR,
                    }
                  )}
                </time>
                , às
                <time>
                  {format(new Date(post.first_publication_date), 'HH:mm', {
                    locale: ptBR,
                  })}
                </time>{' '}
                horas
              </p>
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
      <div className={commonStyles.Container}>
        <div className={styles.NavigationPost}>
          {prevPost && (
            <div className={styles.PreviewPost}>
              <span>{prevPost.title}</span>
              <Link href={`/post/${prevPost.uid}`}>
                <a>Post anterior</a>
              </Link>
            </div>
          )}

          {nextPost && (
            <div className={styles.NextPost}>
              <span>{nextPost.title}</span>
              <Link href={`/post/${nextPost.uid}`}>
                <a>Próximo Post</a>
              </Link>
            </div>
          )}

        </div>
        <div className={styles.Comments}>
          <Comments />
        </div>

        <div className={commonStyles.Preview}>
          {preview && (
            <aside>
              <Link href="/api/exit-preview">
                <a>Sair do modo preview</a>
              </Link>
            </aside>
          )}
        </div>
      </div>
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

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
  previewData,
}) => {
  const { slug } = params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('post', String(slug), {
    ref: previewData?.ref ?? null,
  });

  // -- Getting next_post and prev_post from the current post - Start

  const prevPostResponse = await prismic.query(
    Prismic.predicates.at('document.type', 'post'),
    {
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date desc]',
      fetch: ['posts.title'],
    }
  );

  const nextPostResponse = await prismic.query(
    Prismic.predicates.at('document.type', 'post'),
    {
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date]',
      fetch: ['posts.title'],
    }
  );

  const prevPost = prevPostResponse.results[0]
    ? {
        title: prevPostResponse.results[0].data.title,
        uid: prevPostResponse.results[0].uid,
      }
    : null;

  const nextPost = nextPostResponse.results[0]
    ? {
        title: nextPostResponse.results[0].data.title,
        uid: nextPostResponse.results[0].uid,
      }
    : null;

  // -- Getting next_post and prev_post  - End

  const post = {
    last_publication_date: response.last_publication_date,
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
      preview,
      prevPost,
      nextPost,
    },
    revalidate: 60 * 60 * 24, // 24 hours
  };
};
