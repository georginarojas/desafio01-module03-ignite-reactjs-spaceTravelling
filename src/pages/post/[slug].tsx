import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { RichText } from 'prismic-dom';
import Header from '../../components/Header';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
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
  
  // Reading time - start
  const numberWords = post.data.content.reduce((acc, content) => {
    const headingWords = content.heading.split(' ').length;
    const bodyWords = RichText.asText(content.body).split(' ').length;
    acc += headingWords + bodyWords;
    return acc;
  }, 0);

  const readingTime = Math.ceil(numberWords/200);
  // Reading time - End

  return (
    <>
      <Head>
        <title>Post | SpaceTravelling</title>
      </Head>
      <Header />
    </>
  );
}

export const getStaticPaths = async () => {
  // const prismic = getPrismicClient();
  // const posts = await prismic.query(TODO);

  return {
    paths: [],
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('post', String(slug), {});

  const post = {
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
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
